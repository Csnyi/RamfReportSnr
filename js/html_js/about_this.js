var modalHeader = `
    <h3>    
        About SNR Report with sr-525hd
    </h3>
`;

var modalBody = `
    <p>
        This project was created so that anyone can freely monitor their device.
    </p>
    <p>
        The project was created with html, css, js codes, for a local internal network.
        Not suitable for use via a server.
        Do not make it available over the Internet because
        it does not contain adequate security solutions for this!
        If you do, be careful! Take the proper precautions!
    </p>
    <p>
        Copyright (C) 2024 Csnyi 

        This program is free software: you can redistribute it and/or modify
        it under the terms of the GNU General Public License as published by
        the Free Software Foundation, either version 3 of the License, or
        (at your option) any later version.</br>

        This program is distributed in the hope that it will be useful,
        but WITHOUT ANY WARRANTY; without even the implied warranty of
        MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
        GNU General Public License for more details.</br>

        You should have received a copy of the GNU General Public License
        along with this program.  If not, see <a href="https://www.gnu.org/licenses/" target="_blank"> https://www.gnu.org/licenses/ </a>.
    </p>
    <p>
        We welcome all observations and comments: (GitHub link).
    </p>
    <p>
        The project is available: (GitHub link).
    </p>
`;

var modalFooter = `
    <p>
        Powered by 
        <a href="https://www.w3schools.com/css/css_rwd_intro.asp" target="_blank"> W3Schools</a> | 
        <a href="https://jquery.com" target="_blank">jQuery</a> | 
        <a href="https://plotly.com" target="_blank">PlotlyJS</a> | 
        <a href="https://sheetjs.com" target="_blank">SheetJS</a> | 
        <a href="https://datatables.net/" target="_blank">DataTables</a>
    </p>
`;

$("#modal-header").append(modalHeader);
$("#modal-body").append(modalBody);
$("#modal-footer").append(modalFooter);